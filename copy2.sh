#!/bin/sh
##
## copy2.sh
## Login : <nas@red-baron>
## Started on  Thu May 20 21:00:18 2010 Nathan Stitt
## $Id$
## 
## Copyright (C) 2010 Nathan Stitt
## This program is free software; you can redistribute it and/or modify
## it under the terms of the GNU General Public License as published by
## the Free Software Foundation; either version 2 of the License, or
## (at your option) any later version.
## 
## This program is distributed in the hope that it will be useful,
## but WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
## GNU General Public License for more details.
## 
## You should have received a copy of the GNU General Public License
## along with this program; if not, write to the Free Software
## Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
##


cp -v public/javascripts/wonder_table.js $1/public/javascripts/
cp -v public/stylesheets/wonder_table.css $1/public/stylesheets/
cp -v public/images/icons/*.gif $1/public/images/icons/

